import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Progress,
  Badge,
  Avatar,
  Divider,
  useToast,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Flex,
  Icon,
} from '@chakra-ui/react';
import { CheckIcon, CloseIcon } from '@chakra-ui/icons';
import { 
  doc, 
  updateDoc, 
  onSnapshot, 
  collection,
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/firebase/firebase.config';

const PollComponent = ({ pollData, groupId, currentUser, isOwnPoll = false }) => {
  const [poll, setPoll] = useState(pollData);
  const [hasVoted, setHasVoted] = useState(false);
  const [userVote, setUserVote] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  // Listen for real-time poll updates
  useEffect(() => {
    if (!poll?.id) return;
    
    const pollRef = doc(db, 'groups', groupId, 'polls', poll.id);
    const unsubscribe = onSnapshot(pollRef, (doc) => {
      if (doc.exists()) {
        const updatedPoll = { id: doc.id, ...doc.data() };
        setPoll(updatedPoll);
        
        // Check if current user has voted
        const userVoteOption = updatedPoll.options?.find(option => 
          option.votes?.includes(currentUser.uid)
        );
        setUserVote(userVoteOption?.id || null);
        setHasVoted(!!userVoteOption);
      }
    });

    return () => unsubscribe();
  }, [poll?.id, groupId, currentUser.uid]);

  // Auto-close poll when all members have voted
  useEffect(() => {
    if (!poll?.id || !poll.isActive || !poll.options) return;
    
    // Get all unique voters
    const allVoters = new Set();
    poll.options.forEach(option => {
      option.votes?.forEach(vote => allVoters.add(vote));
    });
    
    // Check if we have group member data and all members have voted
    // This would require passing group member count as prop
    // For now, let's auto-close when we have good participation (3+ votes)
    if (allVoters.size >= 3 && poll.totalVotes >= 3) {
      setTimeout(() => {
        if (poll.isActive) {
          autoClosePoll();
        }
      }, 5000); // Wait 5 seconds before auto-closing
    }
  }, [poll?.totalVotes, poll?.isActive]);

  const autoClosePoll = async () => {
    try {
      const pollRef = doc(db, 'groups', groupId, 'polls', poll.id);
      await updateDoc(pollRef, {
        isActive: false,
        closedAt: serverTimestamp(),
        autoClosedReason: 'All members voted'
      });

      // Find the winning option
      const winningOption = poll.options.reduce((prev, current) => 
        (current.votes?.length || 0) > (prev.votes?.length || 0) ? current : prev
      );

      // Add enhanced result message
      await addDoc(collection(db, 'groups', groupId, 'messages'), {
        userId: 'system',
        userName: 'System',
        userAvatar: '',
        message: `🎉 Poll Results: "${poll.question}" - Winner: "${winningOption.text}" (${winningOption.votes?.length || 0} votes)`,
        timestamp: serverTimestamp(),
        isSystemMessage: true,
        pollResults: {
          pollId: poll.id,
          question: poll.question,
          winner: winningOption,
          totalVotes: poll.totalVotes,
          venue: poll.venue
        }
      });
    } catch (error) {
      console.error('Error auto-closing poll:', error);
    }
  };

  const handleVote = async (optionId) => {
    if (hasVoted || isLoading) return;
    
    setIsLoading(true);
    try {
      // Create a copy of the poll with updated votes
      const updatedOptions = poll.options.map(option => {
        if (option.id === optionId) {
          return {
            ...option,
            votes: [...(option.votes || []), currentUser.uid]
          };
        }
        return option;
      });

      // Calculate total votes
      const totalVotes = updatedOptions.reduce((sum, option) => sum + (option.votes?.length || 0), 0);

      // Update the poll in Firebase
      const pollRef = doc(db, 'groups', groupId, 'polls', poll.id);
      await updateDoc(pollRef, {
        options: updatedOptions,
        totalVotes: totalVotes,
        lastVoteAt: serverTimestamp()
      });

      // Add a system message about the vote
      await addDoc(collection(db, 'groups', groupId, 'messages'), {
        userId: 'system',
        userName: 'System',
        userAvatar: '',
        message: `${currentUser.displayName} voted "${poll.options.find(o => o.id === optionId)?.text}" on the poll`,
        timestamp: serverTimestamp(),
        isSystemMessage: true,
      });

      toast({
        title: 'Vote Cast!',
        description: `You voted for "${poll.options.find(o => o.id === optionId)?.text}"`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: 'Error voting',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const closePoll = async () => {
    try {
      const pollRef = doc(db, 'groups', groupId, 'polls', poll.id);
      await updateDoc(pollRef, {
        isActive: false,
        closedAt: serverTimestamp(),
        closedBy: currentUser.uid
      });

      // Find the winning option
      const winningOption = poll.options.reduce((prev, current) => 
        (current.votes?.length || 0) > (prev.votes?.length || 0) ? current : prev
      );

      // Check if there's a tie
      const maxVotes = winningOption.votes?.length || 0;
      const tiedOptions = poll.options.filter(option => (option.votes?.length || 0) === maxVotes);
      const isTie = tiedOptions.length > 1;

      // Create detailed result message
      let resultMessage;
      if (isTie) {
        resultMessage = `🤝 Poll "${poll.question}" ended in a tie! Tied options: ${tiedOptions.map(o => `"${o.text}"`).join(', ')} (${maxVotes} votes each)`;
      } else {
        resultMessage = `🎉 Poll Results: "${poll.question}" - Winner: "${winningOption.text}" (${maxVotes} votes)`;
      }

      // Add venue-specific meeting suggestion
      let meetingSuggestion = '';
      if (winningOption.venue) {
        meetingSuggestion = ` 📍 Let's meet at ${winningOption.venue.name}!`;
        if (winningOption.venue.address) {
          meetingSuggestion += ` (${winningOption.venue.address})`;
        }
      } else if (winningOption.id === 'other') {
        meetingSuggestion = ' 💭 Time to suggest other options!';
      }

      // Add enhanced result message with meeting suggestion
      await addDoc(collection(db, 'groups', groupId, 'messages'), {
        userId: 'system',
        userName: 'System',
        userAvatar: '',
        message: resultMessage + meetingSuggestion,
        timestamp: serverTimestamp(),
        isSystemMessage: true,
        pollResults: {
          pollId: poll.id,
          question: poll.question,
          winner: winningOption,
          totalVotes: poll.totalVotes,
          venue: winningOption.venue,
          isTie: isTie,
          tiedOptions: isTie ? tiedOptions : null,
          meetingType: poll.meetingType
        }
      });

      toast({
        title: isTie ? 'Poll Ended - Tie!' : 'Poll Closed',
        description: isTie ? `Tie between ${tiedOptions.length} options` : `Winner: "${winningOption.text}"`,
        status: isTie ? 'warning' : 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error closing poll:', error);
      toast({
        title: 'Error closing poll',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (!poll) return null;

  const totalVotes = poll.totalVotes || 0;
  const isActive = poll.isActive !== false;

  return (
    <Card 
      maxW="100%" 
      bg={isActive ? "blue.50" : "gray.50"} 
      border="2px solid" 
      borderColor={isActive ? "blue.200" : "gray.200"}
      shadow="md"
    >
      <CardHeader pb={2}>
        <Flex justify="space-between" align="center">
          <VStack align="start" spacing={1}>
            <HStack>
              <Icon as={CheckIcon} color="blue.500" />
              <Heading size="sm" color="blue.700">
                📊 Poll
              </Heading>
              {!isActive && (
                <Badge colorScheme="red" size="sm">Closed</Badge>
              )}
            </HStack>
            <Text fontSize="md" fontWeight="semibold" color="gray.800">
              {poll.question}
            </Text>
          </VStack>
          
          {isOwnPoll && isActive && (
            <Button 
              size="xs" 
              colorScheme="red" 
              variant="outline"
              onClick={closePoll}
            >
              Close Poll
            </Button>
          )}
        </Flex>
      </CardHeader>

      <CardBody pt={0}>
        <VStack spacing={3} align="stretch">
          {/* Poll Info */}
          {poll.meetingType && (
            <Box bg="white" p={3} borderRadius="md" border="1px solid" borderColor="gray.200">
              <VStack align="start" spacing={2}>
                <Text fontWeight="bold" fontSize="sm" color="purple.600">
                  🎯 Meeting Type: {poll.meetingType}
                </Text>
                {poll.searchFilters && (
                  <HStack spacing={4} fontSize="xs" color="gray.600">
                    {poll.searchFilters.budget && (
                      <Text>💰 Budget: {poll.searchFilters.budget}</Text>
                    )}
                    {poll.searchFilters.atmosphere && (
                      <Text>🌟 {poll.searchFilters.atmosphere}</Text>
                    )}
                    {poll.searchFilters.timePreference && (
                      <Text>🕐 {poll.searchFilters.timePreference}</Text>
                    )}
                  </HStack>
                )}
              </VStack>
            </Box>
          )}

          {/* Poll Options */}
          <VStack spacing={3} align="stretch">
            {poll.options?.map((option) => {
              const voteCount = option.votes?.length || 0;
              const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
              const isSelected = userVote === option.id;
              
              return (
                <Box key={option.id}>
                  <Button
                    w="100%"
                    h="auto"
                    p={3}
                    variant={isSelected ? "solid" : "outline"}
                    colorScheme={isSelected ? "green" : "gray"}
                    isDisabled={!isActive || hasVoted}
                    isLoading={isLoading}
                    onClick={() => handleVote(option.id)}
                    justifyContent="space-between"
                    textAlign="left"
                  >
                    <VStack align="start" spacing={1} flex={1}>
                      <HStack spacing={2} w="100%">
                        <Text fontSize="sm" fontWeight="medium">
                          {option.text}
                        </Text>
                        {isSelected && <CheckIcon boxSize={3} />}
                      </HStack>
                      
                      {/* Venue details for venue options */}
                      {option.venue && (
                        <HStack spacing={3} fontSize="xs" color="gray.600">
                          {option.venue.rating && (
                            <Text>⭐ {option.venue.rating}/10</Text>
                          )}
                          {option.venue.priceLevel && (
                            <Text color="green.600" fontWeight="bold">{option.venue.priceLevel}</Text>
                          )}
                          {option.venue.cuisine && (
                            <Text>{option.venue.cuisine}</Text>
                          )}
                        </HStack>
                      )}
                    </VStack>
                    
                    <Badge variant="subtle" colorScheme={isSelected ? "green" : "gray"}>
                      {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
                    </Badge>
                  </Button>
                  
                  {/* Show member distances for selected venue */}
                  {isSelected && option.venue && option.venue.memberDistances && (
                    <Box bg="green.50" p={2} borderRadius="md" mt={1} border="1px solid" borderColor="green.200">
                      <Text fontSize="xs" fontWeight="semibold" color="green.700" mb={1}>
                        📍 Distances from group members:
                      </Text>
                      <HStack spacing={4} fontSize="xs" color="green.600">
                        {option.venue.memberDistances.map((memberDist, distIndex) => (
                          <Text key={distIndex}>
                            {memberDist.memberName}: {memberDist.distance > 1000 
                              ? `${(memberDist.distance / 1000).toFixed(1)}km`
                              : `${memberDist.distance}m`
                            }
                          </Text>
                        ))}
                      </HStack>
                    </Box>
                  )}
                  
                  {totalVotes > 0 && (
                    <Progress 
                      value={percentage} 
                      size="sm" 
                      colorScheme={isSelected ? "green" : "blue"}
                      bg="gray.100"
                      mt={1}
                    />
                  )}
                </Box>
              );
            })}
          </VStack>

          {/* Poll Stats */}
          <Divider />
          <HStack justify="space-between" fontSize="xs" color="gray.600">
            <HStack spacing={4}>
              <Text>👥 {totalVotes} total votes</Text>
              {poll.createdBy && (
                <HStack spacing={1}>
                  <Text>by</Text>
                  <Avatar src={poll.createdBy.avatar} name={poll.createdBy.name} size="2xs" />
                  <Text fontWeight="medium">{poll.createdBy.name}</Text>
                </HStack>
              )}
            </HStack>
            
            {hasVoted && (
              <Badge colorScheme="green" size="sm">
                ✓ Voted
              </Badge>
            )}
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default PollComponent;
